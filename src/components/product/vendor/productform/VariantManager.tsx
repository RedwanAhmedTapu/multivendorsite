"use client";
import React, { useState, useMemo, JSX, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Trash2, Copy, ChevronDown, Check } from "lucide-react";
import ImageUploader from "@/components/imageuploader/ImageUploader";
import { ProductVariantInput, ProductImageInput } from "@/types/product";
import { VariantNamePart } from "@/types/product";
import { Attribute, AttributeValue } from "@/types/type";

interface Props {
  variants: ProductVariantInput[];
  setVariants: (v: ProductVariantInput[]) => void;
  variantNameParts: Record<string, VariantNamePart>;
  onGenerateVariantName: () => string;
  categoryAttributes?: Attribute[];
}

export default function VariantManager({
  variants,
  setVariants,
  variantNameParts,
  onGenerateVariantName,
  categoryAttributes = [],
}: Props) {
  const [showImageUploaders, setShowImageUploaders] = useState<
    Record<string, boolean>
  >({});
  const [showAttributeDropdown, setShowAttributeDropdown] = useState(false);
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(
    null
  );
  const [showValueDropdown, setShowValueDropdown] = useState(false);

  // Check if a variant is the default empty variant
  const isDefaultEmptyVariant = (variant: ProductVariantInput): boolean => {
    return (
      !variant.name &&
      !variant.sku &&
      variant.price === 0 &&
      variant.stock === 0 &&
      (!variant.attributes || variant.attributes.length === 0)
    );
  };

  // Create a map of attribute values for quick lookup
  const attributeValuesMap = useMemo(() => {
    const map: Record<string, AttributeValue[]> = {};
    
    if (categoryAttributes) {
      categoryAttributes.forEach((attr) => {
        if (attr.values && attr.values.length > 0) {
          map[attr.id] = attr.values;
        }
      });
    }
    
    return map;
  }, [categoryAttributes]);

  // Get all available attributes for selection
  const availableAttributes = useMemo(() => {
    const attributesList: Array<{
      id: string;
      name: string;
      value: any;
      includeInVariant: boolean;
      attributeValues?: AttributeValue[];
    }> = [];

    Object.entries(variantNameParts).forEach(([id, part]) => {
      if (part.include && part.value && part.value !== "") {
        attributesList.push({
          id,
          name: part.name || "",
          value: part.value,
          includeInVariant: part.include,
          attributeValues: attributeValuesMap[id] || [],
        });
      }
    });

    return attributesList;
  }, [variantNameParts, attributeValuesMap]);

  // Helper function to find attribute value ID by value
  const findAttributeValueId = (attributeId: string, value: string): string => {
    const values = attributeValuesMap[attributeId];
    if (!values || values.length === 0) {
      return attributeId;
    }
    
    const found = values.find((v) => v.value === value);
    return found?.id || attributeId;
  };

  // Check if variant exists with specific attribute value
  const variantExists = (attributeId: string, value: string): boolean => {
    const attributeValueId = findAttributeValueId(attributeId, value);
    
    return variants.some((v) =>
      v.attributes?.some(
        (a) => a.attributeValueId === attributeValueId
      )
    );
  };

  // Toggle variant - add if not exists, remove if exists
  const toggleVariantByAttribute = (
    attributeId: string,
    attributeName: string,
    value: string
  ) => {
    const attributeValueId = findAttributeValueId(attributeId, value);
    const exists = variantExists(attributeId, value);

    if (exists) {
      // Remove variant
      const filtered = variants.filter(
        (v) =>
          !v.attributes?.some(
            (a) => a.attributeValueId === attributeValueId
          )
      );
      setVariants(filtered);
    } else {
      // Remove default empty variants first
      const filteredVariants = variants.filter(v => !isDefaultEmptyVariant(v));
      
      // Add new variant
      const variantName = `${attributeName}: ${value}`;
      const newVariant: ProductVariantInput = {
        id: String(Date.now()),
        name: variantName,
        sku: "",
        price: 0,
        stock: 0,
        images: [],
        attributes: [
          {
            attributeValueId: attributeValueId,
            value: value,
          },
        ],
        availability: true,
      };
      setVariants([...filteredVariants, newVariant]);
    }
  };

  const removeVariant = (id?: string) => {
    if (!id) return;

    if (variants.length <= 1) {
      alert("At least one variant row is required");
      return;
    }

    setVariants(variants.filter((v) => v.id !== id));
    setShowImageUploaders((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const handleChange = (
    id: string | undefined,
    field: keyof ProductVariantInput,
    value: string | number | boolean | null
  ) => {
    if (!id) return;
    const updated = variants.map((v) =>
      v.id === id ? { ...v, [field]: value } : v
    );
    setVariants(updated);
  };

  const handleImagesChange = (
    id: string | undefined,
    images: (string | ProductImageInput)[]
  ) => {
    if (!id) return;
    const updated = variants.map((v) =>
      v.id === id ? { ...v, images: images.slice(0, 8) } : v
    );
    setVariants(updated);
  };

  const toggleImageUploader = (id: string | undefined) => {
    if (!id) return;
    setShowImageUploaders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSpecialPriceChange = (
    id: string | undefined,
    specialPrice: number | null
  ) => {
    if (!id) return;
    const variant = variants.find((v) => v.id === id);
    if (!variant) return;

    let discount = 0;
    if (specialPrice && specialPrice < variant.price) {
      discount = Math.round(
        ((variant.price - specialPrice) / variant.price) * 100
      );
    }

    const updated = variants.map((v) =>
      v.id === id ? { ...v, specialPrice: specialPrice || null, discount } : v
    );
    setVariants(updated);
  };

  // Apply price to all from column header
  const applyPriceToAll = (price: number) => {
    if (price <= 0) return;
    const updated = variants.map((v) => ({ ...v, price }));
    setVariants(updated);
  };

  // Apply special price to all from column header
  const applySpecialPriceToAll = (specialPrice: number) => {
    if (specialPrice <= 0) return;
    const updated = variants.map((v) => {
      let discount = 0;
      if (specialPrice < v.price) {
        discount = Math.round(((v.price - specialPrice) / v.price) * 100);
      }
      return { ...v, specialPrice, discount };
    });
    setVariants(updated);
  };

  // Apply stock to all
  const applyStockToAll = (stock: number) => {
    if (stock < 0) return;
    const updated = variants.map((v) => ({ ...v, stock }));
    setVariants(updated);
  };

  // Duplicate variant
  const duplicateVariant = (variantId: string) => {
    const variantToDuplicate = variants.find((v) => v.id === variantId);
    if (!variantToDuplicate) return;

    const newVariant: ProductVariantInput = {
      ...variantToDuplicate,
      id: String(Date.now()),
      sku: "",
      name: `${variantToDuplicate.name} (Copy)`,
    };

    setVariants([...variants, newVariant]);
  };

  // Ensure at least one empty variant exists when there are no variants
  useEffect(() => {
    const hasNonEmptyVariants = variants.some(v => !isDefaultEmptyVariant(v));
    
    if (variants.length === 0 || (!hasNonEmptyVariants && variants.length === 1)) {
      const emptyVariant: ProductVariantInput = {
        id: String(Date.now()),
        name: "",
        sku: "",
        price: 0,
        stock: 0,
        images: [],
        attributes: [],
        availability: true,
      };
      setVariants([emptyVariant]);
    } else {
      // Filter out empty variants if we have real variants
      const hasRealVariants = variants.some(v => !isDefaultEmptyVariant(v));
      if (hasRealVariants) {
        const filtered = variants.filter(v => !isDefaultEmptyVariant(v));
        if (filtered.length !== variants.length) {
          setVariants(filtered);
        }
      }
    }
  }, [variants.length]);

  // Render value dropdown
  const renderValueDropdown = () => {
    if (!selectedAttributeId) return null;

    const attribute = availableAttributes.find((a) => a.id === selectedAttributeId);
    if (!attribute) return null;

    let values: Array<{ id: string; value: string }> = [];
    
    if (attribute.attributeValues && attribute.attributeValues.length > 0) {
      values = attribute.attributeValues.map((av) => ({
        id: av.id,
        value: av.value
      }));
    } else {
      try {
        const parsed = JSON.parse(attribute.value);
        if (Array.isArray(parsed)) {
          values = parsed.map((v, idx) => ({
            id: `${attribute.id}-${idx}`,
            value: String(v)
          }));
        } else {
          values = [{
            id: attribute.id,
            value: String(parsed || attribute.value)
          }];
        }
      } catch {
        values = [{
          id: attribute.id,
          value: String(attribute.value)
        }];
      }
    }

    if (values.length === 0) {
      return (
        <div key="no-values" className="px-4 py-3 text-sm text-gray-500">
          No values available
        </div>
      );
    }

    return values.map((item) => {
      const exists = variantExists(attribute.id, item.value);
      return (
        <button
          key={item.id}
          className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between border-b border-gray-100 last:border-b-0 cursor-pointer ${
            exists
              ? "bg-green-50 hover:bg-green-100"
              : ""
          }`}
          onClick={() => {
            toggleVariantByAttribute(
              attribute.id,
              attribute.name,
              item.value
            );
          }}
        >
          <div className="flex items-center space-x-2">
            <div
              className={`w-4 h-4 flex items-center justify-center ${
                exists
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {exists ? "✓" : "○"}
            </div>
            <span
              className={
                exists
                  ? "font-medium text-green-700"
                  : "text-gray-700"
              }
            >
              {item.value}
            </span>
          </div>
        </button>
      );
    });
  };

  // Filter out default empty rows when displaying
  const displayVariants = variants.filter(v => !isDefaultEmptyVariant(v) || variants.length === 1);

  return (
    <div className="border  p-4 rounded-lg mt-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-lg">Product Variants</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage product variants with different attributes
          </p>
          {availableAttributes.length === 0 && (
            <p className="text-sm text-amber-600 mt-1">
              ⚠️ No attributes marked for variant. Go to Specifications section
              and toggle "Include" switch for attributes you want to use for
              variants.
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              {/* Select Variant Column */}
              <th className="p-3 text-left text-sm font-semibold border border-gray-300 min-w-[180px]">
                <div className="relative">
                  <button
                    onClick={() => {
                      if (availableAttributes.length === 0) {
                        alert(
                          "No attributes available for variants. Please mark attributes as 'Include in Variant' in the Specifications section."
                        );
                        return;
                      }
                      setShowAttributeDropdown(!showAttributeDropdown);
                      setShowValueDropdown(false);
                      setSelectedAttributeId(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded hover:from-purple-600 hover:to-pink-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={availableAttributes.length === 0}
                  >
                    <span>Select Variant</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>

                  {showAttributeDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[200px]">
                      {availableAttributes.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No attributes available for variants
                        </div>
                      ) : (
                        availableAttributes.map((attr) => (
                          <div key={attr.id} className="group relative">
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between border-b border-gray-200 last:border-b-0 bg-blue-50"
                              onClick={() => {
                                setSelectedAttributeId(attr.id);
                                setShowValueDropdown(true);
                                setShowAttributeDropdown(false);
                              }}
                            >
                              <div className="flex items-center space-x-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="font-medium text-sm">
                                  {attr.name}
                                </span>
                              </div>
                              <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {showValueDropdown && selectedAttributeId && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[200px]">
                      <div className="px-3 py-2 border-b border-gray-300 bg-gradient-to-r from-purple-50 to-pink-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-purple-900">
                            {
                              availableAttributes.find(
                                (a) => a.id === selectedAttributeId
                              )?.name
                            }
                          </span>
                          <button
                            onClick={() => {
                              setShowValueDropdown(false);
                              setSelectedAttributeId(null);
                            }}
                            className="p-1 hover:bg-purple-200 rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {renderValueDropdown()}
                      </div>
                    </div>
                  )}
                </div>
              </th>
              <th className="p-3 text-center text-sm font-semibold border border-gray-300 min-w-[150px]">
                Attribute Value
              </th>
              <th className="p-3 text-left text-sm font-semibold border border-gray-300 min-w-[150px]">
                <div>
                  SKU <span className="text-red-500">*</span>
                </div>
              </th>

              <th className="p-3 text-left text-sm font-semibold border border-gray-300 min-w-[140px]">
                <div className="mb-2">
                  Price <span className="text-red-500">*</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Apply to all"
                  className="text-xs h-8"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const value = Number(
                        (e.target as HTMLInputElement).value
                      );
                      if (value > 0) {
                        applyPriceToAll(value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
              </th>

              <th className="p-3 text-left text-sm font-semibold border border-gray-300 min-w-[140px]">
                <div className="mb-2">Special Price</div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Apply to all"
                  className="text-xs h-8"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const value = Number(
                        (e.target as HTMLInputElement).value
                      );
                      if (value > 0) {
                        applySpecialPriceToAll(value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
              </th>

              <th className="p-3 text-left text-sm font-semibold border border-gray-300 min-w-[120px]">
                <div className="mb-2">Stock</div>
                <Input
                  type="number"
                  min="0"
                  placeholder="Apply to all"
                  className="text-xs h-8"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const value = Number(
                        (e.target as HTMLInputElement).value
                      );
                      if (value >= 0) {
                        applyStockToAll(value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
              </th>

              <th className="p-3 text-center text-sm font-semibold border border-gray-300 min-w-[120px]">
                Availability
              </th>

              <th className="p-3 text-center text-sm font-semibold border border-gray-300 min-w-[140px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {displayVariants.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-8 text-center border border-gray-300"
                >
                  <div className="text-gray-500">
                    <p className="mb-2">No variants created yet.</p>
                    <p className="text-sm">
                      Use the "Select Variant" dropdown above to add variants.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              (() => {
                const groupedVariants: Record<string, ProductVariantInput[]> =
                  {};

                displayVariants.forEach((variant) => {
                  const firstAttr = variant.attributes?.[0];
                  const groupKey = firstAttr
                    ? `${firstAttr.attributeValueId}-${firstAttr.value}`
                    : "no-attr";

                  if (!groupedVariants[groupKey]) {
                    groupedVariants[groupKey] = [];
                  }
                  groupedVariants[groupKey].push(variant);
                });

                const rows: JSX.Element[] = [];
                Object.entries(groupedVariants).forEach(
                  ([groupKey, groupVariants]) => {
                    const firstVariant = groupVariants[0];
                    const firstAttr = firstVariant.attributes?.[0];
                    const secondAttr = firstVariant.attributes?.[1];

                    groupVariants.forEach((variant, variantIndex) => {
                      const isFirstInGroup = variantIndex === 0;

                      rows.push(
                        <React.Fragment key={`${variant.id}-${variantIndex}`}>
                          <tr className="hover:bg-gray-50">
                            {isFirstInGroup && firstAttr && (
                              <td
                                rowSpan={groupVariants.length}
                                className="p-3 border border-gray-300 text-center align-middle bg-gradient-to-r from-purple-50 to-blue-50 font-semibold text-purple-800"
                              >
                                {(() => {
                                  const attrPart = Object.values(variantNameParts).find(
                                    part => {
                                      const attribute = categoryAttributes?.find(
                                        attr => attr.values?.some(v => v.id === firstAttr.attributeValueId)
                                      );
                                      return attribute?.name || "Attribute";
                                    }
                                  );
                                  return attrPart?.name || "Attribute";
                                })()}
                              </td>
                            )}
                            {!firstAttr && isFirstInGroup && (
                              <td
                                rowSpan={groupVariants.length}
                                className="p-3 border border-gray-300 text-center align-middle bg-gray-100 font-semibold text-gray-700"
                              >
                                No Attribute
                              </td>
                            )}

                            {isFirstInGroup && firstAttr && (
                              <td
                                rowSpan={groupVariants.length}
                                className="p-3 border border-gray-300 text-center align-middle bg-gradient-to-r from-blue-50 to-pink-50 font-semibold text-blue-800"
                              >
                                {firstAttr.value}
                              </td>
                            )}
                            {!firstAttr && isFirstInGroup && (
                              <td
                                rowSpan={groupVariants.length}
                                className="p-3 border border-gray-300 text-center align-middle bg-gray-100 font-semibold text-gray-700"
                              >
                                -
                              </td>
                            )}

                            {secondAttr && variantIndex === 0 && (
                              <td
                                rowSpan={groupVariants.length}
                                className="p-3 border border-gray-300 text-center align-middle bg-gradient-to-r from-green-50 to-yellow-50 font-semibold text-green-800"
                              >
                                {secondAttr.value}
                              </td>
                            )}

                            <td className="p-3 border border-gray-300">
                              <Input
                                value={variant.sku}
                                onChange={(e) =>
                                  handleChange(
                                    variant.id,
                                    "sku",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter SKU"
                                required
                                className="text-sm"
                              />
                            </td>

                            <td className="p-3 border border-gray-300">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={variant.price || ""}
                                onChange={(e) =>
                                  handleChange(
                                    variant.id,
                                    "price",
                                    Number(e.target.value)
                                  )
                                }
                                placeholder="0.00"
                                required
                                className="text-sm"
                              />
                            </td>

                            <td className="p-3 border border-gray-300">
                              <div className="flex gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={variant.specialPrice || ""}
                                  onChange={(e) =>
                                    handleSpecialPriceChange(
                                      variant.id,
                                      e.target.value
                                        ? Number(e.target.value)
                                        : null
                                    )
                                  }
                                  placeholder="0.00"
                                  className="text-sm flex-1"
                                />
                                {variant.specialPrice && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleSpecialPriceChange(variant.id, null)
                                    }
                                    className="px-1 h-9"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              {variant.specialPrice &&
                                variant.specialPrice >= variant.price && (
                                  <p className="text-xs text-red-500 mt-1">
                                    Must be less than price
                                  </p>
                                )}
                              {variant.specialPrice &&
                                variant.specialPrice < variant.price && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Save: $
                                    {(
                                      variant.price - variant.specialPrice
                                    ).toFixed(2)}{" "}
                                    ({variant.discount}%)
                                  </p>
                                )}
                            </td>

                            <td className="p-3 border border-gray-300">
                              <Input
                                type="number"
                                min="0"
                                value={variant.stock || 0}
                                onChange={(e) =>
                                  handleChange(
                                    variant.id,
                                    "stock",
                                    Number(e.target.value)
                                  )
                                }
                                placeholder="0"
                                className="text-sm"
                              />
                            </td>

                            <td className="p-3 border border-gray-300 text-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={variant.availability !== false}
                                  onChange={(e) =>
                                    handleChange(
                                      variant.id,
                                      "availability",
                                      e.target.checked
                                    )
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              </label>
                            </td>

                            <td className="p-3 border border-gray-300 text-center">
                              <div className="flex justify-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleImageUploader(variant.id)
                                  }
                                  title="Add images"
                                  className="px-2"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => duplicateVariant(variant.id!)}
                                  title="Duplicate variant"
                                  className="px-2"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeVariant(variant.id)}
                                  title="Delete variant"
                                  className="px-2"
                                  disabled={variants.length <= 1}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {showImageUploaders[variant.id!] && (
                            <tr className="bg-blue-50">
                              <td
                                colSpan={8}
                                className="p-4 border border-gray-300"
                              >
                                <div className="mb-2 flex justify-between items-center">
                                  <label className="text-sm font-medium">
                                    Variant Images{" "}
                                    {variant.images &&
                                      variant.images.length > 0 && (
                                        <span className="text-xs text-gray-500">
                                          ({variant.images.length}/8)
                                        </span>
                                      )}
                                  </label>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      toggleImageUploader(variant.id)
                                    }
                                  >
                                    Close
                                  </Button>
                                </div>
                                <ImageUploader
                                  images={(variant.images || []).map((img) =>
                                    typeof img === "string" ? img : img.url
                                  )}
                                  setImages={(images) =>
                                    handleImagesChange(variant.id, images)
                                  }
                                  maxImages={8}
                                />
                              </td>
                            </tr>
                          )}

                          {variant.images &&
                            variant.images.length > 0 &&
                            !showImageUploaders[variant.id!] && (
                              <tr className="bg-gray-50">
                                <td
                                  colSpan={8}
                                  className="p-3 border border-gray-300"
                                >
                                  <div className="flex gap-2 overflow-x-auto">
                                    {variant.images
                                      .slice(0, 6)
                                      .map((img, imgIdx) => (
                                        <div
                                          key={imgIdx}
                                          className="flex-shrink-0"
                                        >
                                          <img
                                            src={
                                              typeof img === "string"
                                                ? img
                                                : img.url
                                            }
                                            alt={
                                              typeof img === "string"
                                                ? `Image ${imgIdx + 1}`
                                                : img.altText || ""
                                            }
                                            className="w-12 h-12 object-cover rounded border"
                                          />
                                        </div>
                                      ))}
                                    {variant.images.length > 6 && (
                                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-200 rounded border text-xs text-gray-600">
                                        +{variant.images.length - 6}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                        </React.Fragment>
                      );
                    });
                  }
                );

                return rows;
              })()
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}